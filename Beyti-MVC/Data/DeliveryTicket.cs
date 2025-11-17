using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Beyti.Data;

[Table("DeliveryTicket")]
[Index("DriverId", Name = "IX_DeliveryTicket_Driver")]
[Index("OrderId", Name = "UX_DeliveryTicket_Order", IsUnique = true)]
public partial class DeliveryTicket
{
    [Key]
    public int Id { get; set; }

    public int OrderId { get; set; }

    public int? DriverId { get; set; }

    public int? PickupAddressId { get; set; }

    public int? DeliveryAddressId { get; set; }

    [StringLength(20)]
    public string Status { get; set; } = null!;

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [Precision(3)]
    public DateTime UpdatedAt { get; set; }

    [ForeignKey("DeliveryAddressId")]
    [InverseProperty("DeliveryTicketDeliveryAddresses")]
    public virtual Address? DeliveryAddress { get; set; }

    [ForeignKey("DriverId")]
    [InverseProperty("DeliveryTickets")]
    public virtual Driver? Driver { get; set; }

    [ForeignKey("OrderId")]
    [InverseProperty("DeliveryTicket")]
    public virtual Order Order { get; set; } = null!;

    [ForeignKey("PickupAddressId")]
    [InverseProperty("DeliveryTicketPickupAddresses")]
    public virtual Address? PickupAddress { get; set; }
}
