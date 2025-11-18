using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Table("Payment")]
[Index("OrderId", Name = "IX_Payment_Order")]
[Index("ServiceBookingId", Name = "IX_Payment_ServiceBooking")]
public partial class Payment
{
    [Key]
    public int Id { get; set; }

    [StringLength(20)]
    public string PaymentFor { get; set; } = null!;

    public int? OrderId { get; set; }

    public int? ServiceBookingId { get; set; }

    [StringLength(20)]
    public string? PaymentType { get; set; }

    [StringLength(60)]
    public string? GatewayName { get; set; }

    [StringLength(120)]
    public string? ExternalRef { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal Amount { get; set; }

    [StringLength(20)]
    public string Status { get; set; } = null!;

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [ForeignKey("OrderId")]
    [InverseProperty("Payments")]
    public virtual Order? Order { get; set; }

    [ForeignKey("ServiceBookingId")]
    [InverseProperty("Payments")]
    public virtual ServiceBooking? ServiceBooking { get; set; }
}
