using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Beyti_MVC.Data;

[Table("Address")]
[Index("IsActive", Name = "IX_Address_Active")]
public partial class Address
{
    [Key]
    public int Id { get; set; }

    [StringLength(50)]
    public string? Label { get; set; }

    [StringLength(200)]
    public string Street { get; set; } = null!;

    [StringLength(100)]
    public string City { get; set; } = null!;

    [StringLength(100)]
    public string? Governorate { get; set; }

    [StringLength(20)]
    public string? Block { get; set; }

    [StringLength(60)]
    public string Country { get; set; } = null!;

    [Column(TypeName = "decimal(10, 7)")]
    public decimal? Latitude { get; set; }

    [Column(TypeName = "decimal(10, 7)")]
    public decimal? Longitude { get; set; }

    public bool IsDefault { get; set; }

    public bool IsActive { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [Precision(3)]
    public DateTime UpdatedAt { get; set; }

    [InverseProperty("Address")]
    public virtual ICollection<CustomerAddress> CustomerAddresses { get; set; } = new List<CustomerAddress>();

    [InverseProperty("DeliveryAddress")]
    public virtual ICollection<DeliveryTicket> DeliveryTicketDeliveryAddresses { get; set; } = new List<DeliveryTicket>();

    [InverseProperty("PickupAddress")]
    public virtual ICollection<DeliveryTicket> DeliveryTicketPickupAddresses { get; set; } = new List<DeliveryTicket>();

    [InverseProperty("DeliveryAddress")]
    public virtual ICollection<Order> OrderDeliveryAddresses { get; set; } = new List<Order>();

    [InverseProperty("PickupAddress")]
    public virtual ICollection<Order> OrderPickupAddresses { get; set; } = new List<Order>();

    [InverseProperty("Address")]
    public virtual ICollection<SellerAddress> SellerAddresses { get; set; } = new List<SellerAddress>();

    [InverseProperty("ServiceAddress")]
    public virtual ICollection<ServiceBooking> ServiceBookings { get; set; } = new List<ServiceBooking>();

    [InverseProperty("Address")]
    public virtual ICollection<ServiceProviderAddress> ServiceProviderAddresses { get; set; } = new List<ServiceProviderAddress>();
}
