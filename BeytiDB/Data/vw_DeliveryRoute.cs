using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Keyless]
public partial class vw_DeliveryRoute
{
    public int DeliveryTicketId { get; set; }

    public int OrderId { get; set; }

    [StringLength(20)]
    public string DeliveryStatus { get; set; } = null!;

    public int? DriverId { get; set; }

    [StringLength(30)]
    public string? DriverPhone { get; set; }

    [StringLength(100)]
    public string? DriverName { get; set; }

    public int CustomerId { get; set; }

    [StringLength(30)]
    public string CustomerPhone { get; set; } = null!;

    [StringLength(100)]
    public string? CustomerName { get; set; }

    public int SellerId { get; set; }

    [StringLength(30)]
    public string? SellerPhone { get; set; }

    [StringLength(120)]
    public string StoreName { get; set; } = null!;

    public int? PickupAddressId { get; set; }

    [StringLength(200)]
    public string? PickupStreet { get; set; }

    [StringLength(100)]
    public string? PickupCity { get; set; }

    [Column(TypeName = "decimal(10, 7)")]
    public decimal? PickupLat { get; set; }

    [Column(TypeName = "decimal(10, 7)")]
    public decimal? PickupLng { get; set; }

    public int? DeliveryAddressId { get; set; }

    [StringLength(200)]
    public string? DeliveryStreet { get; set; }

    [StringLength(100)]
    public string? DeliveryCity { get; set; }

    [Column(TypeName = "decimal(10, 7)")]
    public decimal? DeliveryLat { get; set; }

    [Column(TypeName = "decimal(10, 7)")]
    public decimal? DeliveryLng { get; set; }

    [Column(TypeName = "decimal(11, 2)")]
    public decimal? TotalAmount { get; set; }

    [StringLength(20)]
    public string PaymentMethod { get; set; } = null!;

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [Precision(3)]
    public DateTime UpdatedAt { get; set; }
}
